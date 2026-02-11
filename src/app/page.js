export default function Home() {
  return (
    <div className="flex justify-center h-screen items-center flex-col gap-8 bg-gradient-to-r from-gray-300 to-gray-400">
      <div className="flex justify-center items-center flex-col gap-8 border-2 border-gray-300 rounded-lg p-8 bg-zinc-200 shadow-xl ">
        <h1 className="text-4xl font-bold">
          Welcome to the Personal Portfolio Dashboard!
        </h1>
        <h3 className="text-2xl font-bold">The products towards future</h3>
        <div className="w-180">
          <p className="text-xl">
            As a software developer, I’ve always been passionate about creating
            things that can make people’s lives easier. I’ve been working on
            various projects over the years, and I’m excited to share them with
            you through this portfolio dashboard.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-4">
        <div className="flex flex-col justify-center items-center p-2 border-2 border-gray-300 rounded-lg bg-zinc-200 shadow-xl">
          <h3 className="text-xl font-bold">Next.js</h3>
          <p className="w-60">
            Next.js is a React framework for building full-stack web
            applications. You use React Components to build user interfaces.
          </p>
        </div>

        <div className="flex flex-col justify-center items-center p-2 border-2 border-gray-300  rounded-lg bg-zinc-200 shadow-xl">
          <h3 className="text-xl font-bold">Python</h3>
          <p className="w-60">
            Python is a popular programming language for web development,
            software development, mathematics, and system scripting.
          </p>
        </div>

        <div className="flex flex-col justify-center items-center p-2 border-2 border-gray-300 rounded-lg bg-zinc-200 shadow-xl">
          <h3 className="text-xl font-bold">MongoDB</h3>
          <p className="w-60">
            MongoDB Community Edition is a distributed document database that
            supports ad-hoc queries, secondary indexing, and real-time
            aggregations
          </p>
        </div>
      </div>
      <div  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-4">
        <div className="flex flex-col justify-center items-center p-2 border-2 border-black rounded-lg  bg-black shadow-white-2xl">
          <h3 className="text-2xl text-white font-bold">Todo list</h3>
          <p className="text-white">A website to organize out activity</p>
        </div>
        <div className="flex flex-col justify-center items-center p-2 border-2 border-black rounded-lg bg-black shadow-white-2xl">
          <h3 className="text-2xl text-white font-bold">Blog</h3>
          <p className="text-white">A website to share our thoughts</p>
        </div>
        <div className="flex flex-col justify-center items-center p-2 border-2 border-black rounded-lg bg-black shadow-white-3xl">
          <h3 className="text-2xl text-white font-bold">E-commerce</h3>
          <p className="text-white">A website to sell our products</p>
        </div>
        
      </div>
    </div>
  );
}
