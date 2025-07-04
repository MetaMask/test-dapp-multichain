# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.17.1]

### Changed

- fix: Solana method helpers on E2E mode ([#79](https://github.com/MetaMask/test-dapp-multichain/pull/79))
- fix: mobile resizing on E2E test mode ([#78](https://github.com/MetaMask/test-dapp-multichain/pull/78))

## [0.17.0]

### Changed

- chore: update solana endpoints to match extension `privacy-snapshot.json` ([#76](https://github.com/MetaMask/test-dapp-multichain/pull/76))

## [0.16.0]

### Added

- feat: Refactor method invocation handling and enhance UI for auto-mode ([#74](https://github.com/MetaMask/test-dapp-multichain/pull/74))

### Fixed

- Fix invoke method issues ([#73](https://github.com/MetaMask/test-dapp-multichain/pull/73))

## [0.15.0]

### Added

- feat: Add auto-mode for mobile E2E testing ([#71](https://github.com/MetaMask/test-dapp-multichain/pull/71))
- fix: Enhance element IDs for improved accessibility and E2E testing ([#69](https://github.com/MetaMask/test-dapp-multichain/pull/69))
- chore: Update ESLint and Prettier configurations to include tsx ([#70](https://github.com/MetaMask/test-dapp-multichain/pull/70))

## [0.14.0]

### Added

- feat: Add Auto Connect via postMessage Button and Improve Element IDs for E2E Testing ([#67](https://github.com/MetaMask/test-dapp-multichain/pull/67))

## [0.13.0]

### Added

- feat: Add HTML ID attributes to interactive elements ([#65](https://github.com/MetaMask/test-dapp-multichain/pull/65))

## [0.12.1]

### Added

- feat: Add test-id attributes to improve E2E test selector scoping ([#63](https://github.com/MetaMask/test-dapp-multichain/pull/63))

## [0.12.0]

### Added

- Add support for invoking EIP-5792 methods ([#61](https://github.com/MetaMask/test-dapp-multichain/pull/61))

### Changed

- Properly refresh the invoke method request when target account is changed in dropdown ([#60](https://github.com/MetaMask/test-dapp-multichain/pull/60))

## [0.11.0]

### Changed

- feat: Improve Mobile Responsiveness with Viewport and CSS Updates ([#58](https://github.com/MetaMask/test-dapp-multichain/pull/58))
- feat: remove provider dropdown ([#57](https://github.com/MetaMask/test-dapp-multichain/pull/57))

## [0.10.0]

### Changed

- Replace `caip-x` with `caip-348` for externally_connectable protocol ([#53](https://github.com/MetaMask/test-dapp-multichain/pull/53))

## [0.9.0]

### Changed

- Removed caip-x envelope for Firefox window.postMessage transport ([#54](https://github.com/MetaMask/test-dapp-multichain/pull/54))

## [0.8.0]

### Added

- Add Solana support ([#49](https://github.com/MetaMask/test-dapp-multichain/pull/49))

## [0.7.0]

### Added

- Add Firefox window.postMessage support ([#48](https://github.com/MetaMask/test-dapp-multichain/pull/48))

## [0.6.0]

### Changed

- Improve testability for Connected Scope related work#40 ([#41](https://github.com/MetaMask/test-dapp-multichain/pull/41))
- Improvements to detected wallet UX ([#39](https://github.com/MetaMask/test-dapp-multichain/pull/39))
- Make `from` and `to` addresses the same by default `eth_sendTransaction` calls ([#37](https://github.com/MetaMask/test-dapp-multichain/pull/37))

## [0.5.0]

### Added

- Add custom multi input for chains ([#36](https://github.com/MetaMask/test-dapp-multichain/pull/36))

## [0.4.1]

### Changed

- Move package entries from `dependencies` into `devDependencies` ([#33](https://github.com/MetaMask/test-dapp-multichain/pull/33))

## [0.4.0]

### Added

- Add input to support requesting accounts as part of `wallet_createSession` call ([#31](https://github.com/MetaMask/test-dapp-multichain/pull/31))
- Implement CAIP-294 Wallet Discovery support Multichain API ([#22](https://github.com/MetaMask/test-dapp-multichain/pull/22)) ([#30](https://github.com/MetaMask/test-dapp-multichain/pull/30))

## [0.3.2]

### Fixed

- Update entrypoint and github actions expected build directory ([#28](https://github.com/MetaMask/test-dapp-multichain/pull/28))

## [0.3.1]

### Fixed

- Fix package entrypoints ([#26](https://github.com/MetaMask/test-dapp-multichain/pull/26)).

## [0.3.0]

### Changed

- Make the `connect` method asynchronous in the SDK ([#20](https://github.com/MetaMask/test-dapp-multichain/pull/20)).
- Update `MetaMaskMultichainProvider` to wait briefly after attempting to connect, allowing the onDisconnect event to fire if the connection fails, and checking the isConnected flag accordingly ([#20](https://github.com/MetaMask/test-dapp-multichain/pull/20)).
- Changes the `invokeMethodResults` data structure to store both the result and the request object ([#20](https://github.com/MetaMask/test-dapp-multichain/pull/20)).
- Add a `README.md` for the SDK ([#20](https://github.com/MetaMask/test-dapp-multichain/pull/20)).
- Add mock SDK wrapper and hook for demonstrating a potential pattern for a Multichain API SDK ([#21](https://github.com/MetaMask/test-dapp-multichain/pull/21)).

## [0.2.0]

### Changed

- Improve styling and layout ([#18](https://github.com/MetaMask/test-dapp-multichain/pull/18))

## [0.1.0]

### Added

- Add support for injecting accounts into `wallet_invokeMethod` requests ([#15](https://github.com/MetaMask/test-dapp-multichain/pull/15))
- Store extension Id in local storage for session preservation across page reloads ([#15](https://github.com/MetaMask/test-dapp-multichain/pull/15))
- A bunch of other minor fixes and enhancements ([#15](https://github.com/MetaMask/test-dapp-multichain/pull/15))
- Generally make it prettier ([#15](https://github.com/MetaMask/test-dapp-multichain/pull/15))

## [0.0.7]

### Added

- Add ids for e2e tests ([#13](https://github.com/MetaMask/test-dapp-multichain/pull/13))

## [0.0.6]

### Fixed

- Fix notifications + provider types and add provider dropdown ([#10](https://github.com/MetaMask/test-dapp-multichain/pull/10))

## [0.0.5]

### Added

- Add initial test dapp with mock provider ([#8](https://github.com/MetaMask/test-dapp-multichain/pull/8))

## [0.0.4]

### Uncategorized

- 0.0.3
- fix: publish release missing from docs publish
- 0.0.2
- 0.0.1
- fix: linting issue
- fix: publish docs homepage
- fix: check diff filename
- fix: other linting issues
- Initial Commit of react app and module template

## [0.0.3]

### Uncategorized

- fix: publish release missing from docs publish
- 0.0.2
- 0.0.1
- fix: linting issue
- fix: publish docs homepage
- fix: check diff filename
- fix: other linting issues
- Initial Commit of react app and module template

## [0.0.2]

### Uncategorized

- 0.0.1
- fix: linting issue
- fix: publish docs homepage
- fix: check diff filename
- fix: other linting issues
- Initial Commit of react app and module template

## [0.0.1]

### Uncategorized

- fix: linting issue
- fix: publish docs homepage
- fix: check diff filename
- fix: other linting issues
- Initial Commit of react app and module template

[Unreleased]: https://github.com/MetaMask/test-dapp-multichain/compare/v0.17.1...HEAD
[0.17.1]: https://github.com/MetaMask/test-dapp-multichain/compare/v0.17.0...v0.17.1
[0.17.0]: https://github.com/MetaMask/test-dapp-multichain/compare/v0.16.0...v0.17.0
[0.16.0]: https://github.com/MetaMask/test-dapp-multichain/compare/v0.15.0...v0.16.0
[0.15.0]: https://github.com/MetaMask/test-dapp-multichain/compare/v0.14.0...v0.15.0
[0.14.0]: https://github.com/MetaMask/test-dapp-multichain/compare/v0.13.0...v0.14.0
[0.13.0]: https://github.com/MetaMask/test-dapp-multichain/compare/v0.12.1...v0.13.0
[0.12.1]: https://github.com/MetaMask/test-dapp-multichain/compare/v0.12.0...v0.12.1
[0.12.0]: https://github.com/MetaMask/test-dapp-multichain/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/MetaMask/test-dapp-multichain/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/MetaMask/test-dapp-multichain/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/MetaMask/test-dapp-multichain/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/MetaMask/test-dapp-multichain/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/MetaMask/test-dapp-multichain/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/MetaMask/test-dapp-multichain/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/MetaMask/test-dapp-multichain/compare/v0.4.1...v0.5.0
[0.4.1]: https://github.com/MetaMask/test-dapp-multichain/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/MetaMask/test-dapp-multichain/compare/v0.3.2...v0.4.0
[0.3.2]: https://github.com/MetaMask/test-dapp-multichain/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/MetaMask/test-dapp-multichain/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/MetaMask/test-dapp-multichain/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/MetaMask/test-dapp-multichain/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/MetaMask/test-dapp-multichain/compare/v0.0.7...v0.1.0
[0.0.7]: https://github.com/MetaMask/test-dapp-multichain/compare/v0.0.6...v0.0.7
[0.0.6]: https://github.com/MetaMask/test-dapp-multichain/compare/v0.0.5...v0.0.6
[0.0.5]: https://github.com/MetaMask/test-dapp-multichain/compare/v0.0.4...v0.0.5
[0.0.4]: https://github.com/MetaMask/test-dapp-multichain/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/MetaMask/test-dapp-multichain/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/MetaMask/test-dapp-multichain/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/MetaMask/test-dapp-multichain/releases/tag/v0.0.1
