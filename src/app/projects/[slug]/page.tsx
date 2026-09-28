import { redirect } from 'next/navigation'

// Old per-project URLs (/projects/<slug>) predate the projects page opening a
// project in place. Kept as a redirect so links shared back then still land
// on the right project.
type Props = {
  params: Promise<{ slug: string }>
}

export default async function LegacyProjectRedirect({ params }: Props) {
  const { slug } = await params
  redirect(`/projects?project=${encodeURIComponent(slug)}`)
}
