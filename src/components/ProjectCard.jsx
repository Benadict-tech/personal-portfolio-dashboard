
export default function ProjectCard({image, title, description}){
    return(
        <div className="flex flex-col justify-center items-center bg-white rounded-lg  shadow-md p-4">
            <div className="p-1">
                <img src={image} alt={title}/>
            </div>
            <div className="bg-gray-100 rounded-lg p-4 w-full">
                <h2 className="text-xl font-bold">{title}</h2>
                <p className="text-l ">{description}</p>
            </div>

        </div>
    )
}