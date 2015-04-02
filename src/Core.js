/*
 * Copyright (c) 2011-2013 Lp digital system
 *
 * This file is part of BackBee.
 *
 * BackBee is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * BackBee is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with BackBee. If not, see <http://www.gnu.org/licenses/>.
 */
(function () {
    'use strict';

    define('Core', [
        'Core/Api',
        'Core/ApplicationManager',
        'Core/Mediator',
        'Core/RouteManager',
        'Core/ControllerManager',
        'Core/Utils',
        'Core/Exception',
        'Core/Scope',
        'Core/Config'
    ], function (Core) {
        return Object.freeze(Core);
    });
}());