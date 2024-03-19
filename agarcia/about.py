from typing import List, Dict
from dataclasses import dataclass

from flask import Blueprint, render_template

bp = Blueprint("about", __name__, url_prefix="/about")


@bp.route("/")
def base():
    work: List[Dict[str, str]] = [
        {
            "company": "Capital One",
            "period": "Jan. 2024 - Present",
            "position": "Senior Software/Data Engineer",
            "description": "Building storage solutions for Capital One's data lake",
        },
        {
            "company": "Dotdash Meredith",
            "period": "Aug. 2021 - Dec. 2023",
            "position": "Senior Full Stack Developer",
            "description": "Improving various parts of the editorial process at Dotdash Meredith through work on the CMS ecosystem",
        },
        {
            "company": "FactSet Research Systems",
            "period": "Aug. 2019 - Aug. 2021",
            "position": "Software Engineer III",
            "description":
                "Maintain critical job scheduling infrastructure, as well as build out new product offerings for the Content & Technology Solutions department",
        },
    ]

    @dataclass
    class Image:
        title: str
        filename: str
        alt: str

    fun: List[Image] = [
        Image("Cars", "me-and-car.jpg", "Me smiling next to old porsches"),
        Image("Climbing", "climb.jpg", "Me indoor bouldering"),
        Image("Indy", "Indy.jpg", "Professional photo of a black dog"),
    ]

    return render_template("about.html", work=work, fun=fun)
