tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#aa8744",
                "background-light": "#fdfbf3",
                "background-dark": "#363636",
                "foreground-light": "#363636",
                "foreground-dark": "#fdfbf3",
                "card-light": "#fdfbf3",
                "card-dark": "#2a2a2a",
                "muted-light": "#d1bc97",
                "muted-dark": "#9c642d",
            },
            fontFamily: {
                "display": ["Plus Jakarta Sans", "sans-serif"]
            },
            borderRadius: {
                "DEFAULT": "0.5rem",
                "lg": "0.75rem",
                "xl": "1rem",
                "full": "9999px"
            },
        },
    },
}