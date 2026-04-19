import UIKit
import Social
import MobileCoreServices
import UniformTypeIdentifiers

class ShareViewController: SLComposeServiceViewController {
    private let appGroupId = "group.com.links.app"
    private let sharedKey = "ShareKey"

    override func isContentValid() -> Bool { true }

    override func didSelectPost() {
        guard let inputItems = extensionContext?.inputItems as? [NSExtensionItem] else {
            complete()
            return
        }
        extractFirstUrl(from: inputItems) { [weak self] url in
            guard let self = self else { return }
            if let url = url {
                self.persistToAppGroup(url)
            }
            self.complete()
        }
    }

    override func configurationItems() -> [Any]! { [] }

    private func extractFirstUrl(
        from items: [NSExtensionItem],
        completion: @escaping (String?) -> Void
    ) {
        let urlType = UTType.url.identifier
        let textType = UTType.plainText.identifier
        for item in items {
            guard let attachments = item.attachments else { continue }
            for attachment in attachments {
                if attachment.hasItemConformingToTypeIdentifier(urlType) {
                    attachment.loadItem(forTypeIdentifier: urlType) { data, _ in
                        if let url = data as? URL {
                            completion(url.absoluteString)
                        } else if let s = data as? String {
                            completion(s)
                        } else {
                            completion(nil)
                        }
                    }
                    return
                }
                if attachment.hasItemConformingToTypeIdentifier(textType) {
                    attachment.loadItem(forTypeIdentifier: textType) { data, _ in
                        if let s = data as? String, s.lowercased().hasPrefix("http") {
                            completion(s)
                        } else {
                            completion(nil)
                        }
                    }
                    return
                }
            }
        }
        completion(nil)
    }

    private func persistToAppGroup(_ url: String) {
        guard let defaults = UserDefaults(suiteName: appGroupId) else { return }
        var queued = defaults.stringArray(forKey: sharedKey) ?? []
        queued.append(url)
        defaults.set(queued, forKey: sharedKey)
    }

    private func complete() {
        extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }
}
