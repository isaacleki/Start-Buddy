'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HeartHandshake, MessageCircle, Podcast, BookOpen } from 'lucide-react';

const resources = [
  {
    title: 'ADHD Coaching Collective',
    description: 'Small-group coaching and accountability designed around gentle productivity.',
    href: 'https://www.adhdcollectivecoaching.com',
    icon: HeartHandshake,
  },
  {
    title: 'Focus Friends Discord',
    description: 'Drop-in body doubling sessions, timers, and supportive chat 24/7.',
    href: 'https://discord.gg/focus-friends',
    icon: MessageCircle,
  },
  {
    title: 'How to ADHD',
    description: 'Practical strategies and science-backed videos that normalize ADHD lived experience.',
    href: 'https://www.howtoadhd.com',
    icon: BookOpen,
  },
  {
    title: 'Translating ADHD Podcast',
    description: 'Weekly conversations about motivation, executive function, and shame-free tools.',
    href: 'https://translatingadhd.com',
    icon: Podcast,
  },
];

export default function CommunitiesPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-sm font-medium text-teal-600 dark:text-teal-400">
            <HeartHandshake className="h-4 w-4" />
            Connect with ADHD support
          </div>
          <CardTitle className="text-xl">Find your focus allies</CardTitle>
          <p className="text-sm text-muted-foreground">
            Community makes micro-steps easier. Try a body-doubling room, follow creators who normalize ADHD, or
            bookmark coaching resources for a future you.
          </p>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {resources.map((resource) => {
          const Icon = resource.icon;
          return (
            <Card key={resource.title} className="border-muted">
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium uppercase tracking-wide">Recommended</span>
                </div>
                <CardTitle className="text-lg">{resource.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>{resource.description}</p>
                <Button asChild size="sm">
                  <Link href={resource.href} target="_blank" rel="noreferrer">
                    Explore resource
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
