import React from 'react';
import {
    Card,
    CardMedia,
    CardContent,
    Typography,
    Box,
    Chip,
    Stack
} from '@mui/material';
import { colors, customShadows } from '../theme';

interface ItemCardProps {
    id: string;
    title: string;
    subtitle?: string;
    image?: string;
    metadata?: Array<{
        label: string;
        value: string;
        icon?: React.ReactNode;
    }>;
    tags?: Array<{
        label: string;
        color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
    }>;
    onClick?: (id: string) => void;
    height?: string | number;
    imageHeight?: string | number;
    variant?: 'default' | 'filmstrip';
    textureBackground?: boolean;
}

export const ItemCard: React.FC<ItemCardProps> = ({
    id,
    title,
    subtitle,
    image,
    metadata = [],
    tags = [],
    onClick,
    height = 'auto',
    imageHeight = 140,
    variant = 'default',
    textureBackground = false
}) => {
    const handleClick = () => {
        if (onClick) {
            onClick(id);
        }
    };

    const isFilmstrip = variant === 'filmstrip';

    return (
        <Card
            sx={{
                height,
                display: 'flex',
                flexDirection: 'column',
                cursor: onClick ? 'pointer' : 'default',
                position: 'relative',
                overflow: 'visible',
                boxShadow: customShadows.card,
                transition: 'all 0.2s ease-out',
                background: textureBackground
                    ? `linear-gradient(135deg, ${colors.paper} 0%, #fefefe 100%)`
                    : colors.paper,
                ...(isFilmstrip && {
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '8px',
                        background: `repeating-linear-gradient(
                            to bottom,
                            transparent 0px,
                            transparent 8px,
                            ${colors.coolGray} 8px,
                            ${colors.coolGray} 12px
                        )`,
                        borderTopLeftRadius: 8,
                        borderBottomLeftRadius: 8,
                        zIndex: 1,
                    },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: '8px',
                        background: `repeating-linear-gradient(
                            to bottom,
                            transparent 0px,
                            transparent 8px,
                            ${colors.coolGray} 8px,
                            ${colors.coolGray} 12px
                        )`,
                        borderTopRightRadius: 8,
                        borderBottomRightRadius: 8,
                        zIndex: 1,
                    },
                    paddingLeft: '12px',
                    paddingRight: '12px',
                }),
                '&:hover': onClick ? {
                    transform: 'translateY(-4px)',
                    boxShadow: customShadows.cardHover,
                } : {},
            }}
            onClick={handleClick}
        >
            {image && (
                <CardMedia
                    component="img"
                    height={imageHeight}
                    image={image}
                    alt={title}
                    sx={{
                        objectFit: 'cover',
                        backgroundColor: colors.coolGray,
                        borderBottom: isFilmstrip ? `2px solid ${colors.seleniumGray}` : 'none',
                    }}
                />
            )}

            <CardContent sx={{ flex: 1, p: 2 }}>
                <Typography
                    variant="h6"
                    component="div"
                    sx={{
                        mb: 1,
                        fontSize: '1rem',
                        fontWeight: 600,
                        lineHeight: 1.3,
                        color: colors.charcoal,
                    }}
                >
                    {title}
                </Typography>

                {subtitle && (
                    <Typography
                        variant="body2"
                        sx={{
                            mb: 1.5,
                            color: colors.silverGray,
                            fontSize: '0.875rem',
                        }}
                    >
                        {subtitle}
                    </Typography>
                )}

                {metadata.length > 0 && (
                    <Stack spacing={0.75} sx={{ mb: 1.5 }}>
                        {metadata.map((item, index) => (
                            <Box
                                key={index}
                                display="flex"
                                alignItems="center"
                                gap={1}
                            >
                                {item.icon && (
                                    <Box sx={{ color: colors.silverGray, fontSize: '1rem' }}>
                                        {item.icon}
                                    </Box>
                                )}
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: colors.silverGray,
                                        letterSpacing: '0.05em',
                                        textTransform: 'uppercase',
                                        fontSize: '0.7rem',
                                    }}
                                >
                                    {item.label}:
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: colors.charcoal,
                                        fontVariantNumeric: 'tabular-nums',
                                        fontWeight: 500,
                                        fontSize: '0.75rem',
                                    }}
                                >
                                    {item.value}
                                </Typography>
                            </Box>
                        ))}
                    </Stack>
                )}

                {tags.length > 0 && (
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {tags.map((tag, index) => (
                            <Chip
                                key={index}
                                label={tag.label}
                                size="small"
                                color={tag.color || 'default'}
                                variant="outlined"
                                sx={{
                                    borderColor: tag.color === 'primary'
                                        ? colors.deepAmber
                                        : undefined,
                                    fontWeight: 500,
                                }}
                            />
                        ))}
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};
