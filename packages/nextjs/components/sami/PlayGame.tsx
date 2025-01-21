import { PaperAirplaneIcon } from "@heroicons/react/24/solid";

export const PlayGame = () => {
  return (
    <div className="grid grid-cols-2 w-full h-[calc(100vh-8rem)] rounded-2xl backdrop-brightness-95">
      <div className="flex items-center justify-center overflow-hidden rounded-2xl">
        <img src="sami-team.webp" className="object-cover" />
      </div>
      <div className="flex flex-col items-center justify-between p-4 bg-white rounded-2xl shadow-lg">
        <div className="flex-1 w-full overflow-y-auto p-2">
          <div className="text-gray-500">Welcome! Feel free to chat! Ask questions!</div>
          {/* Placeholder for chat messages */}
          <div className="mt-4 text-black">
            <div className="text-left">
              <span className="font-bold">User1:</span> Hello!
            </div>
            <div className="text-left">
              <span className="font-bold">User2:</span> Hi there!
            </div>
          </div>
        </div>
        <div className="flex w-full mt-4">
          <input
            type="text"
            className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your message..."
          />
          <button className="p-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
