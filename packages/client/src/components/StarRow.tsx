import { IconStar } from './Icons';

interface StarRowProps {
  value: number;
  size?: number;
  animate?: boolean;
}

export function StarRow({ value, size = 18, animate }: StarRowProps) {
  return (
    <span className="stars" aria-label={`${value} of 3 stars`}>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={`stars__item${index < value ? ' stars__item--on' : ''}${
            animate ? ' stars__item--pop' : ''
          }`}
          style={{ animationDelay: `${index * 140}ms` }}
        >
          <IconStar width={size} height={size} />
        </span>
      ))}
    </span>
  );
}
