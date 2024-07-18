export default {
  workerThreads: false,
  files: ['./tests/**/*.js'],
  verbose: true,
  environmentVariables: {
    GITHUB_TOKEN: 'test_GITHUB_TOKEN_test',
    GITLAB_TOKEN: '1'
  }
};