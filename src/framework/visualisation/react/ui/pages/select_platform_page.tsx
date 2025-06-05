export default function SelectPlatformPage() {
  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">Select a Platform</h1>
      <div className="space-x-4">
        <a
          href="?platform=facebook"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 not-prose"
        >
          Facebook
        </a>
        <a
          href="?platform=instagram"
          className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 not-prose"
        >
          Instagram
        </a>
      </div>
    </div>
  );
}

