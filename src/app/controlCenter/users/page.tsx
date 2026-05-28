import UsersClient from "./UsersClient";

export const metadata = {
    title: "Users — Control Center",
    description: "Manage registered users",
};

export default function UsersPage() {
    return <UsersClient />;
}
