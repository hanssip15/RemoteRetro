import { Controller, Get, Req, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../services/user.service';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private jwtService: JwtService, private usersService: UsersService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const { id, name, email, imageUrl } = req.user as { id: string; name: string; email: string; imageUrl: string };
    let user = await this.usersService.findByEmail(email);

    if (!user) {
      // Create new user if not found
      user = await this.usersService.create({ id, name, email, imageUrl });
    }
    if (!user) {
      return res.status(500).json({ message: 'Failed to create or retrieve user.' });
    }
    const payload = { sub: user!.id, email: user!.email, name: user!.name, imageUrl: user!.imageUrl };
    const token = this.jwtService.sign(payload);

    // Send token to frontend
    return res.redirect(`http://localhost:5173/auth/callback?token=${token}`);
  }
}
