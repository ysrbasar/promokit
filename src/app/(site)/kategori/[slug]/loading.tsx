import { Container, Skeleton } from "@/components/ui/primitives";

export default function Loading() {
  return (
    <Container className="pb-28 pt-36">
      <Skeleton className="h-16 w-80" />
      <div className="mt-16 grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 xl:grid-cols-3 lg:pl-[280px]">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/6]" />
        ))}
      </div>
    </Container>
  );
}
