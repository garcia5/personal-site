import React from 'react'

const workExperience = [
  {
    company: 'Velocity Black @ Capital One',
    dates: 'Jan. 2026 - Present',
    title: 'Senior Software Engineer',
    description:
      'Improving member experience and agent efficiency at Velocity Black',
  },
  {
    company: 'Capital One',
    dates: 'Jan. 2024 - Jan. 2026',
    title: 'Senior Data Engineer',
    description: "Building storage solutions for Capital One's data lake",
  },
  {
    company: 'Dotdash Meredith',
    dates: 'Aug. 2021 - Dec. 2023',
    title: 'Senior Full Stack Developer',
    description:
      'Improving various parts of the editorial process at Dotdash Meredith through work on the CMS ecosystem',
  },
  {
    company: 'FactSet Research Systems',
    dates: 'Aug. 2019 - Aug. 2021',
    title: 'Software Engineer III',
    description:
      'Maintain critical job scheduling infrastructure, as well as build out new product offerings for the Content & Technology Solutions department',
  },
]

const funStuff = [
  {
    title: 'Cars',
    image: '/me-and-car.jpg',
    alt: 'Me smiling next to old porsches',
  },
  {
    title: 'Climbing',
    image: '/climb.jpg',
    alt: 'Me indoor bouldering',
  },
  {
    title: 'Indy',
    image: '/Indy.jpg',
    alt: 'Professional photo of a black dog',
  },
]

const About: React.FC = () => {
  return (
    <div className="max-w-prose mb-40 text-center">
      <h1 className="text-3xl font-bold text-center pb-4">About Me</h1>

      <section className="pb-4">
        <h2 className="pb-2 font-bold text-2xl">Work</h2>
        {workExperience.map((job, index) => (
          <div
            key={index}
            className="bg-ctp-surface0 p-4 rounded-lg shadow-md text-left my-4"
          >
            <div className="flex justify-between items-start">
              <p className="text-xl font-bold text-ctp-mauve">{job.company}</p>
              <p className="text-sm text-ctp-subtext0 text-right">
                {job.dates}
              </p>
            </div>
            <p className="text-sm text-ctp-subtext0 pb-2">{job.title}</p>
            <p className="text-ctp-text">{job.description}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="pb-2 font-bold text-2xl">Fun</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {funStuff.map((item, index) => (
            <div
              key={index}
              className="group relative rounded-lg shadow-md overflow-hidden"
            >
              <img
                src={item.image}
                alt={item.alt}
                className="w-full h-full object-cover transition-transform duration-300 md:group-hover:scale-110"
              />
              <div className="bg-ctp-surface0 p-4 flex items-center justify-center md:absolute md:inset-0 md:bg-black md:opacity-60 md:p-0 md:transition-opacity md:duration-300 md:group-hover:opacity-0">
                <h3 className="font-bold text-2xl text-ctp-text">
                  {item.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default About
