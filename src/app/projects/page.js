"use client"
import { MOCK_PROJECTS } from "@/constants";
import ProjectCard from "@/components/ProjectCard";


export default function Projects(){

    console.log("img",MOCK_PROJECTS[0].image);
    

return(
    <div className="flex justify-center h-screen">
        <div className="flex justify-center flex-col gap-6 border-2 border-gray-300 rounded-lg p-5 bg-zinc-200 shadow-xl ">
            <div className="flex justify-center">
                <h1 className="text-3xl p-2">Projects</h1>
            </div>
        
        <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-4">
         {MOCK_PROJECTS.map((project,index) => (<ProjectCard key={project.id} image={project.image} title={project.title} description={project.description}/>))}
        </div>
       </div>
    </div>
)
}