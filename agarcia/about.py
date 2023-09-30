from typing import List, Dict

from flask import Blueprint, render_template

bp = Blueprint("about", __name__, url_prefix="/about")

@bp.route("")
def base():
    work: List[Dict[str, str]] = [
        {
            "company": "Dotdash Meredith",
            "period": "2021 - Present",
            "position": "Senior Full Stack Developer",
            "description": "Improving various parts of the editorial process at Dotdash Meredith through work on the CMS ecosystem",
        },
        {
            "company": "FactSet Research Systems",
            "period": "2019 - 2021",
            "position": "Software Engineer III",
            "description": "Maintain critical job scheduling infrastructure, as well as build out new product offerings for the Content & Technology Solutions department",
        }
    ]

    return render_template("about.html", work=work)
