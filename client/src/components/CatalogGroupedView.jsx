import { AnimatePresence, motion } from "framer-motion";
import { groupCategoriesForDisplay } from "../utils/catalogGroups.js";
import CategorySection from "./CategorySection.jsx";

export default function CatalogGroupedView({
  categories,
  site,
  showGroupTitles = false,
}) {
  const groups = groupCategoriesForDisplay(categories);

  return (
    <>
      {groups.map((group) => {
        const showParentTitle =
          showGroupTitles && group.title && group.categories.some((c) => c.group);

        return (
          <div key={group.key} className="category-group">
            {showParentTitle && (
              <motion.div
                className="category-group-head"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="category-group-title">{group.title}</h2>
              </motion.div>
            )}

            <AnimatePresence initial={false}>
              {group.categories.map((category) => (
                <CategorySection
                  key={category.id}
                  category={category}
                  site={site}
                  isSubcategory={showParentTitle}
                />
              ))}
            </AnimatePresence>
          </div>
        );
      })}
    </>
  );
}
