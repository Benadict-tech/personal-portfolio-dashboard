"use client";
import { useParams } from "next/navigation";
import { MOCK_PROJECT_DETAIL } from "@/constants";

export default function ProjectDetail({ params }) {
  const { id } = useParams();

  const { title, description, image, techStack, gitLink, liveDemoLink } =
    MOCK_PROJECT_DETAIL.find((project) => project.id === parseInt(id));

  console.log(
    "project",
    title,
    description,
    image,
    techStack,
    gitLink,
    liveDemoLink,
  );

  return (
    <div className="min-h-screen flex flex-col ">
      <div className="flex justify-center items-center flex-col gap-8 ">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
        </div>
        <div className="p-2 rounded-lg shadow-md hover:shadow-xl">
          <img
            src={image}
            alt={title}
            className="w-96 h-64 object-cover rounded-lg shadow-md"
          />
        </div>
        <div className="w-220">
          <p className="text-xl">{description}</p>
        </div>
        <div className="flex justify-between items-center w-full p-4 bg-gray-100 rounded-lg">
          <div>
            <h2 className="text-2xl font-bold ">Tech Stack</h2>
            {techStack.map((tech, index) => (
              <p key={index} className="text-xl py-2">
                {tech}
              </p>
            ))}
          </div>
          <div className="flex flex-col gap-4">
            <div className="p-2">
                <h4 className="font-bold">GitHub Link</h4>
                <p className=" text-l">{gitLink}</p>
            </div>
            <div className=" p-2">
                <h4 className="font-bold">Live Demo Link</h4>
                <p className="text-l">{liveDemoLink}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
