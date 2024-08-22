export default function withDarkModeLoader<P>(Loader: React.ComponentType<P>) {
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

  return (props: P) => {
    return (
      <Loader {...props} color={prefersDarkMode ? '#fff' : '#000'} />
    );
  };
}