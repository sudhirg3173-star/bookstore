import ControlCenterClient from "./ControlCenterClient";

export const metadata = {
    title: "Control Center — Admin",
    description: "Manage books and standards catalogue",
};

export default function ControlCenterPage({ searchParams }: { searchParams: { tab?: string } }) {
    return <ControlCenterClient initialTab={searchParams.tab} />;
}
