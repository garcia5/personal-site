import React, { useState } from 'react';

const configData = [
    {
        url: "https://github.com/garcia5/dotfiles/blob/master/files/nvim/init.lua",
        display: "Neovim",
        id: "nvim",
        image: "/Nvim Showcase.png",
    },
    {
        url: "https://github.com/garcia5/dotfiles/blob/master/files/wezterm.lua",
        display: "WezTerm",
        id: "wez",
        image: "/Terminal Showcase.png",
    },
    {
        url: "https://github.com/garcia5/dotfiles/blob/master/files/zshrc",
        display: "Zsh",
        id: "zsh",
    },
    {
        url: "https://github.com/garcia5/dotfiles/blob/master/files/functions",
        display: "(Mostly) FZF Integration",
        id: "fzf",
        image: "/fzf-1.png",
    },
];

const Dotfiles: React.FC = () => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    return (
        <div className="text-left max-w-xl mb-40">
            <h1 className="text-3xl font-bold text-center pb-4">Dotfiles</h1>
            <p>These are links to some of my personal configurations, updated relatively frequently</p>
            <ul className="my-4">
                {configData.map((config) => (
                    <li key={config.id}>
                        <a href={config.url} target="_blank" rel="noopener noreferrer" className="text-xl text-ctp-mauve hover:underline">
                            {config.display}
                        </a>
                        {config.image && (
                            <div className="bg-ctp-surface0 p-2 rounded-lg shadow-md object-cover cursor-pointer my-2" onClick={() => setSelectedImage(config.image)}>
                                <img
                                    src={config.image}
                                    alt={`${config.display} Showcase`}
                                    className="rounded-md transition-transform duration-300 ease-in-out transform hover:scale-105"
                                />
                            </div>
                        )}
                    </li>
                ))}
            </ul>

            {selectedImage && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
                    onClick={() => setSelectedImage(null)}
                >
                    <img 
                        src={selectedImage} 
                        alt="Enlarged showcase" 
                        className="max-w-screen-xl max-h-screen-xl object-contain"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image itself
                    />
                </div>
            )}
        </div>
    );
};

export default Dotfiles;
