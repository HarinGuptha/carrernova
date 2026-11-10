export default ({ config }) => ({
  ...config,
  scheme: process.env.EXPO_PUBLIC_APP_VARIANT === 'native' ? 'careernova' : undefined,
});
