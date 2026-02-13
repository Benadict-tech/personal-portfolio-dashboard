"use client"
import { MOCK_PROJECTS } from "@/constants";
import ProjectCard from "@/components/ProjectCard";
import Link from "next/link";



export default function Projects(){

    console.log("img",MOCK_PROJECTS[0].image);
    

return(
    <div className="flex-1">
        <div className="flex justify-center ">
        <div className="flex justify-center flex-col gap-6 border-2 border-gray-300 rounded-lg p-5 bg-zinc-200 shadow-xl ">
            <div className="flex justify-center">
                <h1 className="text-3xl p-2">Projects</h1>
            </div>
        
        <div className=" h-screen grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-4 ">
         {MOCK_PROJECTS.map((project,index) => (<Link href={`/projects/${project.id}`} key={index}>
         <ProjectCard key={project.id} image={project.image} title={project.title} description={project.description}/>
         </Link>))}
        </div>
       </div>
    </div>
    </div>
    
)
}