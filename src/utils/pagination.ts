import { PaginatedResponse, PaginationQuery } from '@/types';

export interface PaginationOptions {
  page: number;
  limit: number;
  total: number;
}

export class PaginationUtils {
  static readonly DEFAULT_PAGE = 1;
  static readonly DEFAULT_LIMIT = 10;
  static readonly MAX_LIMIT = 100;

  static validateAndNormalizePagination(query: PaginationQuery): { page: number; limit: number } {
    const page = Math.max(query.page || this.DEFAULT_PAGE, 1);
    const limit = Math.min(Math.max(query.limit || this.DEFAULT_LIMIT, 1), this.MAX_LIMIT);

    return { page, limit };
  }

  static calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  static createPaginatedResponse<T>(
    data: T[],
    options: PaginationOptions
  ): PaginatedResponse<T> {
    const { page, limit, total } = options;
    const totalPages = Math.ceil(total / limit);
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  static getPaginationInfo(page: number, limit: number, total: number) {
    const totalPages = Math.ceil(total / limit);
    const offset = this.calculateOffset(page, limit);
    
    return {
      page,
      limit,
      offset,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      isFirstPage: page === 1,
      isLastPage: page === totalPages,
    };
  }

  /**
   * Generates pagination metadata for API responses
   */
  static generatePaginationMeta(totalRecords: number, page: number, limit: number) {
    const totalPages = Math.ceil(totalRecords / limit);
    const currentPage = Math.max(page, 1);
    
    return {
      currentPage,
      totalPages,
      totalRecords,
      recordsPerPage: limit,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      nextPage: currentPage < totalPages ? currentPage + 1 : null,
      previousPage: currentPage > 1 ? currentPage - 1 : null,
    };
  }
}