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
        {id: 1, title: "Todo list", description: "A website to organize out activity",image: imgArray[0].src,},
        {id: 2, title: "Blog", description: "A website to share our thoughts",image: imgArray[1].src,},
        {id: 3, title: "E-commerce", description: "A website to sell our products",image: imgArray[2].src,},
        {id: 4, title: "Portfolio", description: "A website to showcase our work",image:imgArray[3].src,},
        {id: 5, title: "Chat app", description: "A website to chat with our friends",image: imgArray[4].src,},
        {id: 6, title: "Weather app", description: "A website to check the weather",image:imgArray[5].src,},
        {id: 7, title: "Recipe app", description: "A website to find recipes",image: imgArray[6].src,},
        {id: 8, title: "Fitness app", description: "A website to track our fitness",image: imgArray[7].src,},
        {id: 9, title: "Music app", description: "A website to listen to music",image: imgArray[8].src,}

    ] 