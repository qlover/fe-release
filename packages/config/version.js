class VersionConsts {}

VersionConsts.RELEASE_TYPES = ['patch', 'minor', 'major'];
VersionConsts.PRERELEASE_TYPES = ['prepatch', 'preminor', 'premajor'];
VersionConsts.CONTINUATION_TYPES = ['prerelease', 'pre'];
VersionConsts.ALL_RELEASE_TYPES = [
  ...VersionConsts.RELEASE_TYPES,
  ...VersionConsts.PRERELEASE_TYPES,
  ...VersionConsts.CONTINUATION_TYPES
];

export default VersionConsts;
