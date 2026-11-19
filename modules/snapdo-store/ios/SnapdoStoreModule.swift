// StoreKit 2 bridge for Snapdo Pro.
// Kept deliberately small: it cannot be compiled outside Xcode, so the first Codemagic
// log is its compiler. Scene-safe (no keyWindow), new APIs behind #available.
import ExpoModulesCore
import StoreKit
import UIKit

struct SnapdoStoreError: LocalizedError {
  let message: String
  var errorDescription: String? { message }
}

public final class SnapdoStoreModule: Module {
  private var updatesTask: Task<Void, Never>?

  public func definition() -> ModuleDefinition {
    Name("SnapdoStore")

    Events("onEntitlementsChanged")

    OnCreate {
      self.listenForTransactions()
    }

    OnDestroy {
      self.updatesTask?.cancel()
      self.updatesTask = nil
    }

    // Products with display price, period, "per month" price for yearly plans and free-trial days.
    AsyncFunction("getProducts") { (ids: [String]) async throws -> [[String: Any]] in
      let products = try await Product.products(for: ids)
      var out: [[String: Any]] = []
      for product in products {
        out.append(await SnapdoStoreModule.describe(product))
      }
      return out
    }

    // "purchased" | "cancelled" | "pending" | "unverified"
    AsyncFunction("purchase") { (id: String) async throws -> String in
      guard let product = try await Product.products(for: [id]).first else {
        throw SnapdoStoreError(message: "Product \(id) was not found in the App Store.")
      }
      let result: Product.PurchaseResult
      if #available(iOS 17.0, *), let scene = await SnapdoStoreModule.activeScene() {
        result = try await product.purchase(confirmIn: scene, options: [])
      } else {
        result = try await product.purchase(options: [])
      }
      switch result {
      case .success(let verification):
        guard case .verified(let transaction) = verification else { return "unverified" }
        await transaction.finish()
        await self.emitEntitlements()
        return "purchased"
      case .userCancelled:
        return "cancelled"
      case .pending:
        return "pending"
      @unknown default:
        return "cancelled"
      }
    }

    // Product ids of subscriptions that are active right now.
    AsyncFunction("entitlements") { () async -> [String] in
      return await SnapdoStoreModule.activeProductIds()
    }

    // "Restore purchases": syncs with the App Store (may ask for the Apple ID password).
    AsyncFunction("restore") { () async throws -> [String] in
      try await AppStore.sync()
      let ids = await SnapdoStoreModule.activeProductIds()
      self.sendEvent("onEntitlementsChanged", ["ids": ids])
      return ids
    }

    // "Production" | "Sandbox" | "Xcode" | "unknown" — shown as a diagnostics line in test builds.
    AsyncFunction("environment") { () async -> String in
      do {
        let shared = try await AppTransaction.shared
        if case .verified(let appTransaction) = shared {
          return appTransaction.environment.rawValue
        }
        return "unverified"
      } catch {
        return "unknown"
      }
    }
  }

  // Renewals, refunds, Ask to Buy approvals and purchases made on another device arrive here.
  private func listenForTransactions() {
    guard updatesTask == nil else { return }
    updatesTask = Task.detached(priority: .background) { [weak self] in
      for await update in Transaction.updates {
        if case .verified(let transaction) = update {
          await transaction.finish()
        }
        await self?.emitEntitlements()
      }
    }
  }

  private func emitEntitlements() async {
    let ids = await SnapdoStoreModule.activeProductIds()
    sendEvent("onEntitlementsChanged", ["ids": ids])
  }

  static func activeProductIds() async -> [String] {
    var ids: [String] = []
    for await entitlement in Transaction.currentEntitlements {
      guard case .verified(let transaction) = entitlement else { continue }
      if transaction.revocationDate != nil { continue }
      if let expires = transaction.expirationDate, expires < Date() { continue }
      ids.append(transaction.productID)
    }
    return ids
  }

  @MainActor
  static func activeScene() -> UIWindowScene? {
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    return scenes.first(where: { $0.activationState == .foregroundActive }) ?? scenes.first
  }

  static func describe(_ product: Product) async -> [String: Any] {
    var d: [String: Any] = [
      "id": product.id,
      "displayName": product.displayName,
      "displayPrice": product.displayPrice,
      "price": NSDecimalNumber(decimal: product.price).doubleValue,
    ]
    guard let subscription = product.subscription else { return d }
    let period = subscription.subscriptionPeriod
    d["period"] = SnapdoStoreModule.unitName(period.unit)
    d["periodCount"] = period.value
    if period.unit == .year && period.value == 1 {
      d["monthlyPrice"] = (product.price / 12).formatted(product.priceFormatStyle)
    }
    if let offer = subscription.introductoryOffer, offer.paymentMode == .freeTrial {
      let eligible = await subscription.isEligibleForIntroOffer
      if eligible {
        d["trialDays"] = SnapdoStoreModule.days(offer.period)
      }
    }
    return d
  }

  static func unitName(_ unit: Product.SubscriptionPeriod.Unit) -> String {
    switch unit {
    case .day: return "day"
    case .week: return "week"
    case .month: return "month"
    case .year: return "year"
    @unknown default: return "unknown"
    }
  }

  static func days(_ period: Product.SubscriptionPeriod) -> Int {
    switch period.unit {
    case .day: return period.value
    case .week: return period.value * 7
    case .month: return period.value * 30
    case .year: return period.value * 365
    @unknown default: return 0
    }
  }
}
