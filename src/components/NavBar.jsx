import Link from 'next/link'
export default function NavBar() {
    return(
        <div>
            <nav className="bg-black h-20 flex items-center justify-between px-8">
            <div>
                <h1 className="text-white text-2xl font-bold">Personal Portfolio Dashboard</h1>
            </div>
            <div>
                <Link href="/" className="text-white mx-4 hover:text-gray-300">Home</Link>
                <Link href="/projects" className="text-white mx-4 hover:text-gray-300">Projects</Link>
                
            </div>
            </nav>
        </div>
    )
}