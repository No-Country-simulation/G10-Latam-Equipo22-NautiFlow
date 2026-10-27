-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_embarcacionId_fkey" FOREIGN KEY ("embarcacionId") REFERENCES "embarcaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rating_check" CHECK ("rating" BETWEEN 1 AND 5);
