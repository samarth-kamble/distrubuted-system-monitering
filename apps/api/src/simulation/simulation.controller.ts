import {
  Controller,
  Get,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';

@Controller('simulation')
export class SimulationController {
  private verifyEnvironment() {
    // Guard simulation endpoints: Forbidden in production environment
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        'Simulation endpoints are disabled in production environment',
      );
    }
  }

  @Get('healthy')
  getHealthy() {
    this.verifyEnvironment();
    return { status: 'healthy', timestamp: new Date().toISOString() };
  }

  @Get('500')
  get500() {
    this.verifyEnvironment();
    throw new InternalServerErrorException(
      'Simulated 500 Internal Server Error',
    );
  }

  @Get('slow')
  async getSlow() {
    this.verifyEnvironment();
    // Delay response for 5 seconds
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return { status: 'slow', delayMs: 5000 };
  }

  @Get('timeout')
  async getTimeout() {
    this.verifyEnvironment();
    // Delay response for 15 seconds to trigger network prober client timeouts
    await new Promise((resolve) => setTimeout(resolve, 15000));
    return { status: 'timeout', delayMs: 15000 };
  }

  @Get('flaky')
  getFlaky() {
    this.verifyEnvironment();
    // Random failure simulation: 50% probability
    if (Math.random() < 0.5) {
      throw new InternalServerErrorException('Simulated flaky server failure');
    }
    return { status: 'flaky_success', flaky: true };
  }
}
