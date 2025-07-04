import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service'; // Your user check service

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
  async googleCallback(@Req() req, @Res() res) {
    const email = req.user.email;
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: User not found in database' });
    }

    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);

    // Send token to frontend
    return res.redirect(`http://localhost:5173/auth/callback?token=${token}`);
  }
}
