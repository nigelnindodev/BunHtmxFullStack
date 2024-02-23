export const LoginPage = () => {
    return (
        <html data-theme="dark" lang="en">
            <head>
                <title>Login</title>
                <link rel="stylesheet" href="http://localhost:3000/public/pico.min.css" />
                <link rel="stylesheet" href="http://localhost:3000/public/tailwind.css" />
                <link rel="stylesheet" href="http://localhost:3000/public/custom.css" />
                <script src="http://localhost:3000/public/htmx.min.js" />
                <script src="http://localhost:3000/public/theme_switcher.js" />
            </head>
            <body id="body-container">
                <nav class="container-fluid">
                    <ul>
                        <li><a href="http://localhost:3000" aria-label="Back home"><svg aria-hidden="true" focusable="false" role="img"
                            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" height="56px">
                            <path fill="currentColor"
                                d="M633.43 429.23c0 118.38-49.76 184.72-138.87 184.72-53 0-92.04-25.37-108.62-67.32h-2.6v203.12H250V249.7h133.67v64.72h2.28c17.24-43.9 55.3-69.92 107-69.92 90.4 0 140.48 66.02 140.48 184.73zm-136.6 0c0-49.76-22.1-81.96-56.9-81.96s-56.9 32.2-57.24 82.28c.33 50.4 22.1 81.63 57.24 81.63 35.12 0 56.9-31.87 56.9-81.95zM682.5 547.5c0-37.32 30.18-67.5 67.5-67.5s67.5 30.18 67.5 67.5S787.32 615 750 615s-67.5-30.18-67.5-67.5z" />
                        </svg></a></li>
                        <li>Business Name</li>
                    </ul>
                </nav>
                <main class="container">
                    <h3>Log in to get started.</h3>
                    <form>
                        <label for="username">Username</label>
                        <input type="username" id="username" name="username" placeholder="Username" required />
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password" placeholder="Password" required />
                        <button type="submit" hx-post="/auth/login" hx-target="#body-container" hx-swap="outerHTML">Login</button>
                    </form>
                </main>
            </body>
        </html>
    );
};
