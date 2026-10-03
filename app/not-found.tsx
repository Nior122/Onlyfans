import Link from "next/link";
import { Compass } from "lucide-react";
import { buttonClass } from "@/components/ui/buttonClass";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col justify-center py-16">
      <Container>
        <Card className="mx-auto w-full max-w-md text-left">
          <Compass className="size-4 text-accent-text" aria-hidden="true" />
          <h1 className="mt-3 text-section font-semibold">Page not found</h1>
          <p className="mt-2 text-body text-fg-secondary">
            That link does not exist. The builder and your prompt library are one click away.
          </p>
          <Link href="/" className={buttonClass({ className: "mt-4" })}>
            Back to the builder
          </Link>
        </Card>
      </Container>
    </main>
  );
}
