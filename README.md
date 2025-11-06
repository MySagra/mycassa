# MyCassa

MyCassa is a modern cash register application built with Next.js. It provides a seamless interface for managing orders, tables, and payments in a restaurant or cafe environment.

## Features

- **Order Management**: Create, confirm, and manage orders with ease.
- **Ingredient Customization**: Modify ingredients for each order item, with automatic surcharge calculation.
- **Discounts**: Apply fixed amount discounts to orders.
- **Authentication**: Secure login and session management using NextAuth.
- **Backend-for-Frontend (BFF)**: Server Actions for efficient API communication.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/MySagra/mycassa.git
   ```

2. Navigate to the project directory:
   ```bash
   cd mycassa
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a `.env.local` file based on `.env.example` and configure the environment variables:
   ```bash
   cp .env.example .env.local
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Environment Variables

The following environment variables are required:

- `API_URL`: The base URL of the backend API.
- `NEXTAUTH_SECRET`: A secret key for NextAuth.
- `NEXTAUTH_URL`: The URL of your Next.js application.

## Scripts

- `npm run dev`: Start the development server.
- `npm run build`: Build the application for production.
- `npm start`: Start the production server.

## Folder Structure

- `app/`: Contains the Next.js pages and layouts.
- `components/`: Reusable UI components.
- `actions/`: Server Actions for API communication.
- `lib/`: Utility functions and API types.
- `public/`: Static assets.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add your message here"
   ```
4. Push to the branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/).
- Authentication powered by [NextAuth](https://next-auth.js.org/).
- UI components inspired by modern design systems.

---

Enjoy using MyCassa! If you encounter any issues, feel free to open an issue on GitHub.