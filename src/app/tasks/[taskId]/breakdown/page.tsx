import { redirect } from 'next/navigation';

type BreakdownPageProps = {
  params: Promise<{ taskId: string }>;
};

export default async function TaskBreakdownRedirect({ params }: BreakdownPageProps) {
  const { taskId } = await params;
  redirect(`/tasks/new?task=${taskId}#steps`);
}
