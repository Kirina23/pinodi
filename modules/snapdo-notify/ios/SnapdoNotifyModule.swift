// Local reminders for Snapdo: permission + "replace all scheduled Snapdo reminders with this list".
// Local only (UNCalendarNotificationTrigger): no push, no server, no aps-environment entitlement.
// Kept small on purpose — it cannot be compiled outside Xcode, so the first Codemagic log checks it.
import ExpoModulesCore
import UserNotifications

struct SnapdoReminder: Record {
  @Field var id: String = ""
  @Field var title: String = ""
  @Field var body: String = ""
  /** Milliseconds since 1970 (JavaScript Date.getTime()). */
  @Field var at: Double = 0
}

public final class SnapdoNotifyModule: Module {
  private static let prefix = "snapdo."

  public func definition() -> ModuleDefinition {
    Name("SnapdoNotify")

    // "granted" | "denied" | "undetermined"
    AsyncFunction("status") { () async -> String in
      let settings = await UNUserNotificationCenter.current().notificationSettings()
      return SnapdoNotifyModule.describe(settings.authorizationStatus)
    }

    // Shows the system "Allow notifications?" dialog (only the first time), then returns the status.
    AsyncFunction("request") { () async throws -> String in
      let center = UNUserNotificationCenter.current()
      _ = try await center.requestAuthorization(options: [.alert, .sound])
      let settings = await center.notificationSettings()
      return SnapdoNotifyModule.describe(settings.authorizationStatus)
    }

    // Removes every pending Snapdo reminder and schedules the given ones. Returns how many were added.
    AsyncFunction("replaceAll") { (items: [SnapdoReminder]) async throws -> Int in
      let center = UNUserNotificationCenter.current()
      let pending = await center.pendingNotificationRequests()
      let ours = pending.map { $0.identifier }.filter { $0.hasPrefix(SnapdoNotifyModule.prefix) }
      center.removePendingNotificationRequests(withIdentifiers: ours)
      var added = 0
      let now = Date()
      for item in items {
        let date = Date(timeIntervalSince1970: item.at / 1000)
        if date <= now || item.title.isEmpty { continue }
        let content = UNMutableNotificationContent()
        content.title = item.title
        content.body = item.body
        content.sound = .default
        let parts = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: date)
        let trigger = UNCalendarNotificationTrigger(dateMatching: parts, repeats: false)
        let request = UNNotificationRequest(identifier: SnapdoNotifyModule.prefix + item.id, content: content, trigger: trigger)
        try await center.add(request)
        added += 1
      }
      return added
    }

    // Removes every pending Snapdo reminder (reminders switched off).
    AsyncFunction("cancelAll") { () async -> Void in
      let center = UNUserNotificationCenter.current()
      let pending = await center.pendingNotificationRequests()
      let ours = pending.map { $0.identifier }.filter { $0.hasPrefix(SnapdoNotifyModule.prefix) }
      center.removePendingNotificationRequests(withIdentifiers: ours)
    }
  }

  private static func describe(_ status: UNAuthorizationStatus) -> String {
    switch status {
    case .authorized, .provisional, .ephemeral:
      return "granted"
    case .denied:
      return "denied"
    case .notDetermined:
      return "undetermined"
    @unknown default:
      return "undetermined"
    }
  }
}
