
import React from 'react';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readOnly?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, onRatingChange, readOnly = false }) => {
  return (
    <div className="flex flex-row-reverse justify-end items-center">
      {[5, 4, 3, 2, 1].map((star) => (
        <span
          key={star}
          className={`text-2xl ${!readOnly ? 'cursor-pointer' : ''} ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
          onClick={() => !readOnly && onRatingChange?.(star)}
          onMouseOver={() => !readOnly && onRatingChange?.(star)}
        >
          ★
        </span>
      ))}
    </div>
  );
};

export default StarRating;
