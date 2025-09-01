import { Controller, Get, Req, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../services/user.service';
import { Request, Response } from 'express';
import { ApiTags } from '@nestjs/swagger';

@ApiTags("Auth")
@Controller('auth')
export class AuthController {
  constructor(private jwtService: JwtService, private usersService: UsersService) {}
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
  }
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const { name, email, imageUrl } = req.user as { id: string; name: string; email: string; imageUrl: string };
    let user = await this.usersService.findByEmail(email);
    if (!user) {
      const userData = { 
        name: name , 
        email, 
        imageUrl: imageUrl 
      };
      
      user = await this.usersService.create(userData);
    }
    if (!user) {
      return res.status(500).json({ message: 'Failed to create or retrieve user.' });
    }
    const payload = { 
      sub: user!.id, 
      email: user!.email, 
      name: user!.name, 
      imageUrl: user!.imageUrl 
    };
    const token = this.jwtService.sign(payload);
    const frontendUrl = process.env.FRONTEND_URL; // Use environment variable or default to localhost
    res.cookie('token', token, {
      httpOnly: false,
      secure: true,
      sameSite: 'none',
      maxAge: 60 * 60 * 1000
    });
    return res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getCurrentUser(@Req() req: Request) {

    // req.user contains the decoded JWT payload
    const user = req.user as any;
    return {
      id: user?.sub,
      email: user?.email,
      name: user?.name,
      imageUrl: user?.imageUrl
    };
  }

  @Get('logout')
  logout(@Res() res: Response) {
    res.clearCookie('token', {
      httpOnly: false,
      secure: true,
      sameSite: 'none',
      path: '/',
    });
    return res.json({ message: 'Logged out successfully' });
  }

}
