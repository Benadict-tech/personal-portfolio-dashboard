import img1 from "../public/assets/img-1.jpeg";
import img2 from "../public/assets/img-2.jpeg";
import img3 from "../public/assets/img-3.jpeg";
import img4 from "../public/assets/img-4.jpeg";
import img5 from "../public/assets/img-5.jpeg";
import img6 from "../public/assets/img-6.jpeg";
import img7 from "../public/assets/img-7.jpeg";
import img8 from "../public/assets/img-8.jpeg";
import img9 from "../public/assets/img-9.jpeg";

const imgArray = [img1, img2, img3, img4, img5, img6, img7, img8, img9];

export const MOCK_PROJECTS = [
  {
    id: 1,
    title: "Todo list",
    description: "A website to organize out activity",
    image: imgArray[0].src,
  },
  {
    id: 2,
    title: "Blog",
    description: "A website to share our thoughts",
    image: imgArray[1].src,
  },
  {
    id: 3,
    title: "E-commerce",
    description: "A website to sell our products",
    image: imgArray[2].src,
  },
  {
    id: 4,
    title: "Portfolio",
    description: "A website to showcase our work",
    image: imgArray[3].src,
  },
  {
    id: 5,
    title: "Chat app",
    description: "A website to chat with our friends",
    image: imgArray[4].src,
  },
  {
    id: 6,
    title: "Weather app",
    description: "A website to check the weather",
    image: imgArray[5].src,
  },
  {
    id: 7,
    title: "Recipe app",
    description: "A website to find recipes",
    image: imgArray[6].src,
  },
  {
    id: 8,
    title: "Fitness app",
    description: "A website to track our fitness",
    image: imgArray[7].src,
  },
  {
    id: 9,
    title: "Music app",
    description: "A website to listen to music",
    image: imgArray[8].src,
  },
];

export const MOCK_PROJECT_DETAIL = [
  {
    id: 1,
    title: "Todo list",
    description:
      "Productivity begins with a to-do list. It’s the first step toward organizing your work and getting it done. To-do lists are essentially a repository of tasks, but they can be much more than that, especially if you’re using a to-do list for project management. To-do list apps can describe the work, prioritize it and more Using a to-do list app to manage projects keeps you focused and limits distractions so you and your team can complete work in a timely manner. To-do list apps take a scrap of paper that most of us jot our tasks down on and turn into a visual task management tool for working more efficiently",
    image: imgArray[0].src,
    techStack: ["Next.js", "MongoDB", "Tailwind CSS"],
    gitLink:"www.github.com/benliu/todo-list",
    liveDemoLink:"www.todo-list.com"
  },
  {
    id: 2,
    title: "Blog",
    description:
        "A blog is a type of website that focuses on written content, often in the form of articles or posts. Blogs can cover a wide range of topics, from personal experiences and opinions to news and analysis on specific subjects. They can be created by individuals, organizations, or businesses and can serve various purposes, such as sharing information, promoting products or services, or building a community around a particular topic. Blogs typically allow readers to leave comments and engage with the content, making them a popular platform for communication and interaction online.",
    image: imgArray[1].src,
    techStack: ["Next.js", "MongoDB", "Tailwind CSS"],
    gitLink:"www.github.com/benliu/blog",
    liveDemoLink:"www.blog.com"
  },
  {
    id: 3,
    title: "E-commerce",
    description:
        "E-commerce, short for electronic commerce, refers to the buying and selling of goods and services over the internet. It encompasses a wide range of online business activities, including online retail stores, marketplaces, and digital services. E-commerce allows businesses to reach a global audience and provides consumers with the convenience of shopping from anywhere at any time. It typically involves online transactions, secure payment processing, and efficient delivery systems to facilitate the exchange of products and services in the digital marketplace.",
    image: imgArray[2].src,
    techStack: ["Next.js", "MongoDB", "Tailwind CSS"],
    gitLink:"www.github.com/benliu/e-commerce",
    liveDemoLink:"www.e-commerce.com"
  },
  {
    id: 4,
    title: "Portfolio",
    description:
        "A portfolio is a collection of work samples, projects, or achievements that showcase an individual's skills, experience, and accomplishments. It is often used by professionals, artists, designers, writers, and other creatives to demonstrate their capabilities and attract potential clients or employers. A portfolio can include a variety of content, such as images, videos, written descriptions, case studies, and testimonials. It serves as a visual representation of one's expertise and can be presented in various formats, including physical portfolios, online websites, or digital presentations.",
    image: imgArray[3].src,
    techStack: ["Next.js", "MongoDB", "Tailwind CSS"],
    gitLink:"www.github.com/benliu/portfolio",
    liveDemoLink:"www.portfolio.com" 
    },
    {
    id: 5,
    title: "Chat app",
    description:
        "A chat app, also known as a messaging app, is a software application that allows users to communicate with each other in real-time through text, voice, or video messages. Chat apps can be used for personal communication between friends and family, as well as for professional communication within teams and organizations. They often include features such as group chats, file sharing, emojis, and notifications to enhance the user experience. Popular chat apps include WhatsApp, Facebook Messenger, Slack, and Microsoft Teams.",
    image: imgArray[4].src,
    techStack: ["Next.js", "MongoDB", "Tailwind CSS"],
    gitLink:"www.github.com/benliu/chat-app",
    liveDemoLink:"www.chat-app.com"
    },
    {
    id: 6,
    title: "Weather app",
    description:
        "A weather app is a software application that provides users with real-time information about the weather conditions in their location or any other specified location. Weather apps typically display current temperature, humidity, wind speed, and precipitation levels, as well as forecasts for the upcoming hours, days, or weeks. They may also include features such as radar maps, severe weather alerts, and the ability to save multiple locations for quick access. Weather apps are commonly used on smartphones and tablets to help users plan their day and stay informed about changing weather conditions.",
    image: imgArray[5].src,
    techStack: ["Next.js", "MongoDB", "Tailwind CSS"],
    gitLink:"www.github.com/benliu/weather-app",
    liveDemoLink:"www.weather-app.com"
    },
    {
    id: 7,
    title: "Recipe app",
    description:
        "A recipe app is a software application that provides users with a collection of cooking recipes and related features. Recipe apps typically allow users to search for recipes based on ingredients, cuisine, dietary preferences, or meal types. They may also include features such as step-by-step cooking instructions, nutritional information, shopping lists, and the ability to save favorite recipes for easy access. Recipe apps are commonly used by home cooks and food enthusiasts to discover new dishes, plan meals, and improve their cooking skills.",
    image: imgArray[6].src,
    techStack: ["Next.js", "MongoDB", "Tailwind CSS"],
    gitLink:"www.github.com/benliu/recipe-app",
    liveDemoLink:"www.recipe-app.com"
    },
    {
    id: 8,
    title: "Fitness app",
    description:
        "A fitness app is a software application that helps users track and manage their physical activity, exercise routines, and overall health. Fitness apps typically offer features such as workout tracking, goal setting, progress monitoring, and personalized exercise plans. They may also include features like nutrition tracking, sleep monitoring, and social sharing to encourage user engagement and motivation. Fitness apps are commonly used by individuals looking to improve their fitness levels, maintain a healthy lifestyle, or achieve specific health goals.",
    image: imgArray[7].src,
    techStack: ["Next.js", "MongoDB", "Tailwind CSS"],
    gitLink:"www.github.com/benliu/fitness-app",
    liveDemoLink:"www.fitness-app.com"
    },
    {
    id: 9,
    title: "Music app",
    description:
        "A music app is a software application that allows users to listen to, discover, and manage their music collection. Music apps typically offer features such as streaming music, creating playlists, downloading songs for offline listening, and personalized recommendations based on user preferences. They may also include social features that allow users to share music with friends and follow their favorite artists. Popular music apps include Spotify, Apple Music, and Pandora.",
    image: imgArray[8].src,
    techStack: ["Next.js", "MongoDB", "Tailwind CSS"],
    gitLink:"www.github.com/benliu/music-app",
    liveDemoLink:"www.music-app.com",
    }
];
