// src/baseComponents/PageTitle.tsx
interface PageTitleProps {
    title: string;
    subtitle?: string;
    className?: string;
}

export default function PageTitle({
                                      title,
                                      subtitle,
                                      className = "",
                                  }: PageTitleProps) {
    return (
        <div className={`mb-8 text-right ${className}`}>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                {title}
            </h1>
            {subtitle && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {subtitle}
                </p>
            )}
        </div>
    );
}
