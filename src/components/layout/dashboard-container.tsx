type ContainerProps = {
  children: React.ReactNode;
};

export default function DashboardContainer({ children }: ContainerProps) {
  return <main className="mx-auto w-full max-w-5xl px-6">{children}</main>;
}
