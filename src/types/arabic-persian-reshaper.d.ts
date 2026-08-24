
declare module 'arabic-persian-reshaper' {
    interface PersianShaper {
        convertArabic(text: string): string;
    }

    interface ArabicShaper {
        convertArabic(text: string): string;
    }

    const reshaper: {
        PersianShaper: PersianShaper;
        ArabicShaper: ArabicShaper;
    };

    export default reshaper;
}
