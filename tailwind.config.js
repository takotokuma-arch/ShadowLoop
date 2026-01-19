/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // We are using slate/indigo/teal by default in classes, 
                // no need to custom define unless we want specific overrides.
                // But let's add the Nordic palette references just in case specific RGBs are needed later
                // or to satisfy the "Configuring" part of the plan if I missed it.
                // For now, standard colors are fine as I used standard class names.
            }
        },
    },
    plugins: [],
}
