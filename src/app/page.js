
import Link from "next/link";

export default function HomePage() {
  return (
    
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      
      
      <div className="text-center max-w-4xl mx-auto py-12 px-6 sm:px-10 rounded-xl shadow-2xl bg-gray-800/70 backdrop-blur-sm border border-gray-700/50">
        
        
        <h1 className="
          text-4xl sm:text-6xl lg:text-6xl font-extrabold mb-10 p-2 tracking-tighter 
          bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-sky-500 
          transition duration-500 ease-in-out hover:from-sky-500 hover:to-teal-400
        ">
          Cling Reminder
        </h1>

        
        <p className="text-xl sm:text-2xl text-gray-300 mb-10 font-light max-w-2xl mx-auto">
          Your personal assistant for timely and essential task management. Never forget what truly matters.
        </p>

        
        <Link
          href="/login"
          className="
            inline-block px-9 py-3 text-lg font-semibold rounded-full shadow-lg 
            transition duration-300 ease-in-out transform hover:scale-105 
            bg-teal-500 text-gray-900 hover:bg-teal-400 hover:shadow-xl hover:text-gray-900 
            focus:outline-none focus:ring-4 focus:ring-teal-500 focus:ring-opacity-50 
            active:scale-95
          "
        >
          Get Started with Email Login &rarr;
        </Link>
        
        
        <p className="mt-8 text-sm text-gray-500">
          Ready to simplify your life?
        </p>
        
      </div>
    </main>
  );
}