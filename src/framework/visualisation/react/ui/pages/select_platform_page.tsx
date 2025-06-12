export const PLATFORMS = [
  {
    name: "Facebook",
    value: "facebook",
    className: "bg-blue-500 hover:bg-blue-600",
  },
  {
    name: "Instagram",
    value: "instagram",
    className: "bg-pink-500 hover:bg-pink-600",
  },
] as const;

export function PlatformsList() {
  return <>
    {
      PLATFORMS.map((platform) => (
        <a
          key={platform.value}
          href={`?platform=${platform.value}`}
          className={`px-4 py-2 text-white rounded ${platform.className} not-prose`}
        >
          {platform.name}
        </a>
      ))
    }
  </>
}

export default function SelectPlatformPage() {
  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">Select a Platform</h1>
      <div className="flex gap-4 items-center flex-wrap">
        <PlatformsList />
      </div>
    </div>
  );
}

