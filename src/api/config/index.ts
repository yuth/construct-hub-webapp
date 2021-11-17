import { API_PATHS } from "../../constants/url";

export interface PackageLinkConfig {
  linkLabel: string;
  configKey: string;
  linkText?: string;
}

export interface PackageKeyword {
  label: string;
  color?: string;
}

export interface PackageHighlight extends PackageKeyword {
  icon?: string;
}

export interface PackageTagConfig {
  id: string;
  keyword?: PackageKeyword;
  highlight?: PackageHighlight;
  searchFilter?: {
    groupBy: string;
    display: string;
  };
}

export interface Category {
  title: string;
  url: string;
}

/**
 * Configuration for packages to feature on the home page.
 */
export interface FeaturedPackages {
  /**
   * Grouped sections of packages on the homepage.
   */
  readonly sections: FeaturedPackagesSection[];
}

/**
 * Customization options for one section of the home page.
 */
export interface FeaturedPackagesSection {
  /**
   * The name of the section (displayed as a header).
   */
  readonly name: string;

  /**
   * Show the N most recently updated packages in this section.
   * Cannot be used with `showPackages`.
   */
  readonly showLastUpdated?: number;

  /**
   * Show an explicit list of packages.
   * Cannot be used with `showLastUpdated`.
   */
  readonly showPackages?: FeaturedPackagesDetail[];
}

/**
 * Customization options for a specific package on the home page.
 */
export interface FeaturedPackagesDetail {
  /**
   * The name of the package.
   */
  readonly name: string;

  /**
   * An additional comment to include with the package.
   */
  readonly comment?: string;
}

export interface FeatureFlags {}

export interface Config {
  featureFlags?: FeatureFlags;
  packageLinks?: PackageLinkConfig[];
  featuredPackages?: FeaturedPackages;
  packageTags?: PackageTagConfig[];
  categories?: Category[];
}

export const DEFAULT_FEATURED_PACKAGES = {
  sections: [
    {
      name: "Recently updated",
      showLastUpdated: 10,
    },
  ],
};

const defaultConfig: Config = {
  featureFlags: {},
  packageLinks: [],
  featuredPackages: DEFAULT_FEATURED_PACKAGES,
};

export const fetchConfig = async (): Promise<Config> => {
  if (window.configOverride) {
    return window.configOverride;
  }

  const response = await fetch(API_PATHS.CONFIG);

  if (!response.ok) {
    console.log("Failed to fetch application config, using default values");
    return defaultConfig;
  }

  return response.json().catch((err) => {
    console.error(err);
    console.log("Invalid config response, using default values");
    return defaultConfig;
  });
};
