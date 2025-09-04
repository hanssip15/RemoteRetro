import { RedirectNotFoundFilter } from '../src/common/filters/redirect-not-found-exception.filter';
import { NotFoundException } from '@nestjs/common';

describe('RedirectNotFoundFilter', () => {
  let filter: RedirectNotFoundFilter;
  let mockResponse: any;
  let mockHost: any;

  beforeEach(() => {
    filter = new RedirectNotFoundFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockHost = {
      switchToHttp: jest.fn().mockReturnThis(),
      getResponse: jest.fn().mockReturnValue(mockResponse),
    };
  });

  it('should return 404 response with custom JSON', () => {
    const exception = new NotFoundException('Data tidak ditemukan');

    filter.catch(exception, mockHost);

    // Pastikan status 404 dipanggil
    expect(mockResponse.status).toHaveBeenCalledWith(404);

    // Pastikan response json sesuai format
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Data tidak ditemukan',
      redirectUrl: '/halaman-tujuan',
    });
  });


});
