# [2.0.0](https://github.com/jimmy-guzman/cleanx/compare/v1.1.0...v2.0.0) (2025-11-19)


### Features

* ✨ full rewrite to focus on around gitignore ([#17](https://github.com/jimmy-guzman/cleanx/issues/17)) ([e4148a3](https://github.com/jimmy-guzman/cleanx/commit/e4148a3fad28d455dd534d176673df4ed9c52725))


### BREAKING CHANGES

* 💥 no more configuration, it simply just uses
`.gitignore` to clean

# [1.1.0](https://github.com/jimmy-guzman/cleanx/compare/v1.0.8...v1.1.0) (2025-06-20)


### Bug Fixes

* 🐛 clarify Node.js engine as ^20.19.0 || >=22.12.0 ([0e51d4f](https://github.com/jimmy-guzman/cleanx/commit/0e51d4ffac57f9dddd2b09594ac44bed1dc8cd59))


### Features

* ✨ replace `ansis` with Node.js `util.styleText` ([2930611](https://github.com/jimmy-guzman/cleanx/commit/29306113bc728d5cc0e8e7066cf7ada2782f20a7))

## [1.0.8](https://github.com/jimmy-guzman/cleanx/compare/v1.0.7...v1.0.8) (2025-06-12)


### Bug Fixes

* 🐛 stop deleting workspaces, always ([#13](https://github.com/jimmy-guzman/cleanx/issues/13)) ([5e95ab2](https://github.com/jimmy-guzman/cleanx/commit/5e95ab21ce89bf133d53862226023867c8da3977))

## [1.0.7](https://github.com/jimmy-guzman/cleanx/compare/v1.0.6...v1.0.7) (2025-06-04)


### Bug Fixes

* 🐛 reliably resolve workspace configurations ([#12](https://github.com/jimmy-guzman/cleanx/issues/12)) ([3c0151a](https://github.com/jimmy-guzman/cleanx/commit/3c0151aeb56c8a61cbde51b0e0c5d0a3753f26b2))

## [1.0.6](https://github.com/jimmy-guzman/cleanx/compare/v1.0.5...v1.0.6) (2025-06-03)


### Bug Fixes

* 🐛 infer workspaces as advertised ([#11](https://github.com/jimmy-guzman/cleanx/issues/11)) ([c7370f2](https://github.com/jimmy-guzman/cleanx/commit/c7370f2240c46a3298895f4a6a712834e7d1878e))

## [1.0.5](https://github.com/jimmy-guzman/cleanx/compare/v1.0.4...v1.0.5) (2025-06-03)


### Bug Fixes

* 🐛 add missing sensible default include paths ([15c5ead](https://github.com/jimmy-guzman/cleanx/commit/15c5ead705b77a1a08431ad08d0cebb6114f961c))
* 🐛 use correct storybook dist directory ([7b4e43d](https://github.com/jimmy-guzman/cleanx/commit/7b4e43de543e4c4feed99cd3e58da123fe0d5ce4))

## [1.0.4](https://github.com/jimmy-guzman/cleanx/compare/v1.0.3...v1.0.4) (2025-06-03)


### Bug Fixes

* 🐛 actually default dry run as `false` ([#9](https://github.com/jimmy-guzman/cleanx/issues/9)) ([a03cc30](https://github.com/jimmy-guzman/cleanx/commit/a03cc301a25966b91a05b3bfbb5f538f46660820))

## [1.0.3](https://github.com/jimmy-guzman/cleanx/compare/v1.0.2...v1.0.3) (2025-06-03)


### Bug Fixes

* 🐛 should not delete workspaces ([#8](https://github.com/jimmy-guzman/cleanx/issues/8)) ([4c19551](https://github.com/jimmy-guzman/cleanx/commit/4c19551455e45faf2673ab6264d71059483f7af7))

## [1.0.2](https://github.com/jimmy-guzman/cleanx/compare/v1.0.1...v1.0.2) (2025-06-03)


### Bug Fixes

* 🐛 actually expose `defineConfig` ([#7](https://github.com/jimmy-guzman/cleanx/issues/7)) ([331c105](https://github.com/jimmy-guzman/cleanx/commit/331c105f2c7c351d071a0d6b98a3428a3bff5739))

## [1.0.1](https://github.com/jimmy-guzman/cleanx/compare/v1.0.0...v1.0.1) (2025-06-03)


### Bug Fixes

* 🐛 actually respect `dryRun` configuration ([db404b2](https://github.com/jimmy-guzman/cleanx/commit/db404b255090c1718bc13494ef4a018a20ae5b6c))
* 🐛 add missing `.eslintcache` to defaults ([e2b93cf](https://github.com/jimmy-guzman/cleanx/commit/e2b93cf2bd3f96630bb65565f91f67c2d1de97e2)), closes [#3](https://github.com/jimmy-guzman/cleanx/issues/3)
* 🐛 be consistent about (dry run) suffix ([603ab12](https://github.com/jimmy-guzman/cleanx/commit/603ab12550a07bf20df40866c570ac5abfb69b64))
* 🐛 maybe fix not finding configs in monorepos ([d9c6bf4](https://github.com/jimmy-guzman/cleanx/commit/d9c6bf4b2966a6e88aff7e24e8373a6416f74784))
* 🐛 prevent undefined (reading 'profiles') ([2059ea8](https://github.com/jimmy-guzman/cleanx/commit/2059ea8c6765e4c81728df8f5f7a7a24e3be801d)), closes [#4](https://github.com/jimmy-guzman/cleanx/issues/4)

# 1.0.0 (2025-06-01)


### Features

* ✨ first release of `cleanx` ([7e69730](https://github.com/jimmy-guzman/cleanx/commit/7e6973073d74ece55c9d7d220e3b2e49aff6d7b4))
