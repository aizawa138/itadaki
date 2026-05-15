type ContainerProps = {
  children: React.ReactNode;
};

export default function DashboardContainer({ children }: ContainerProps) {
  return <main className="mx-auto">{children}</main>;
}
